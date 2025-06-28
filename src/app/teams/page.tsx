'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeamAnalytics } from '@/components/team/TeamAnalytics';
import { 
  Users, 
  Plus, 
  Settings, 
  BarChart3, 
  UserPlus, 
  Crown,
  Activity,
  Clock,
  Calendar
} from 'lucide-react';

interface Team {
  id: string;
  name: string;
  description?: string;
  role: 'owner' | 'admin' | 'member';
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function TeamsPage() {
  const { data: session, status } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin');
    }
    
    if (status === 'authenticated') {
      fetchTeams();
    }
  }, [status]);

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      if (response.ok) {
        const data = await response.json();
        setTeams(data.teams || []);
        if (data.teams && data.teams.length > 0) {
          setSelectedTeam(data.teams[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'member': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-3 h-3" />;
      case 'admin': return <Settings className="w-3 h-3" />;
      case 'member': return <Users className="w-3 h-3" />;
      default: return <Users className="w-3 h-3" />;
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session?.user?.id) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-8 h-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Teams
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your teams and analyze team performance with detailed insights.
              </p>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Team
            </Button>
          </div>
        </div>

        {teams.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Teams Yet
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Create your first team to start collaborating and tracking team analytics.
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Team
              </Button>
            </div>
          </Card>
        ) : (
          <Tabs value={selectedTeam} onValueChange={setSelectedTeam} className="space-y-6">
            {/* Team Selector */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <TabsList className="flex space-x-8 border-none bg-transparent p-0">
                {teams.map((team) => (
                  <TabsTrigger
                    key={team.id}
                    value={team.id}
                    className="flex items-center gap-3 px-4 py-3 text-left data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent"
                  >
                    <div className="flex flex-col items-start">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {team.name}
                        </span>
                        <Badge className={`text-xs ${getRoleColor(team.role)}`}>
                          {getRoleIcon(team.role)}
                          <span className="ml-1">{team.role}</span>
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {team.memberCount} members
                      </span>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Team Content */}
            {teams.map((team) => (
              <TabsContent key={team.id} value={team.id} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Team Info */}
                  <div className="lg:col-span-1">
                    <Card className="p-6">
                      <div className="text-center">
                        <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                          <Users className="w-8 h-8 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {team.name}
                        </h3>
                        {team.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            {team.description}
                          </p>
                        )}
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Members:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {team.memberCount}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Role:</span>
                            <Badge className={`text-xs ${getRoleColor(team.role)}`}>
                              {getRoleIcon(team.role)}
                              <span className="ml-1">{team.role}</span>
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Created:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {new Date(team.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="mt-6 space-y-2">
                          <Button variant="outline" size="sm" className="w-full">
                            <UserPlus className="w-4 h-4 mr-2" />
                            Invite Members
                          </Button>
                          {(team.role === 'owner' || team.role === 'admin') && (
                            <Button variant="outline" size="sm" className="w-full">
                              <Settings className="w-4 h-4 mr-2" />
                              Team Settings
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>

                    {/* Quick Stats */}
                    <Card className="p-4 mt-6">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                        Quick Stats
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Activity className="w-4 h-4 text-green-600" />
                          <div className="flex-1">
                            <div className="text-sm text-gray-600 dark:text-gray-400">Activity</div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              High
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <div className="flex-1">
                            <div className="text-sm text-gray-600 dark:text-gray-400">Last Active</div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              2 hours ago
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-purple-600" />
                          <div className="flex-1">
                            <div className="text-sm text-gray-600 dark:text-gray-400">Projects</div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              5 active
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Team Analytics */}
                  <div className="lg:col-span-3">
                    <Card className="p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <BarChart3 className="w-6 h-6 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Team Analytics
                        </h3>
                      </div>
                      
                      <TeamAnalytics teamId={team.id} />
                    </Card>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
}