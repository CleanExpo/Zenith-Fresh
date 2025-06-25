'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { FeatureFlag } from '@/components/FeatureFlag';
import { TeamDetails } from '@/components/teams/TeamDetails';
import { TeamMembers } from '@/components/teams/TeamMembers';
import { TeamProjects } from '@/components/teams/TeamProjects';
import { TeamActivity } from '@/components/teams/TeamActivity';
import { TeamSettings } from '@/components/teams/TeamSettings';

interface TeamMember {
  id: string;
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

interface TeamProject {
  id: string;
  createdAt: string;
  project: {
    id: string;
    name: string;
    url: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
  };
  creator: {
    id: string;
    name: string;
    email: string;
  };
}

interface TeamInvitation {
  id: string;
  email: string;
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  createdAt: string;
  expiresAt: string;
  inviter: {
    id: string;
    name: string;
    email: string;
  };
}

interface TeamActivityItem {
  id: string;
  action: string;
  details?: any;
  metadata?: any;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

interface Team {
  id: string;
  name: string;
  description?: string;
  slug: string;
  avatar?: string;
  settings?: any;
  createdAt: string;
  updatedAt: string;
  userRole: 'ADMIN' | 'MEMBER' | 'VIEWER';
  members: TeamMember[];
  projects: TeamProject[];
  invitations: TeamInvitation[];
  activities: TeamActivityItem[];
  _count: {
    members: number;
    projects: number;
  };
}

type TabType = 'overview' | 'members' | 'projects' | 'activity' | 'settings';

export default function TeamPage() {
  const { data: session } = useSession();
  const params = useParams();
  const teamId = params.teamId as string;
  
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => {
    if (session?.user && teamId) {
      fetchTeam();
    }
  }, [session, teamId]);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/teams/${teamId}`);
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('You do not have access to this team');
        } else if (response.status === 404) {
          throw new Error('Team not found');
        }
        throw new Error('Failed to fetch team');
      }
      
      const data = await response.json();
      setTeam(data.team);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'members', name: 'Members', icon: '👥' },
    { id: 'projects', name: 'Projects', icon: '📋' },
    { id: 'activity', name: 'Activity', icon: '📈' },
    ...(team?.userRole === 'ADMIN' ? [{ id: 'settings', name: 'Settings', icon: '⚙️' }] : []),
  ] as const;

  if (!session?.user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Please sign in to view this team.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-2">Loading team...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-red-800 mb-4">{error}</p>
          <button
            onClick={fetchTeam}
            className="text-red-600 hover:text-red-700 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Team not found.</p>
      </div>
    );
  }

  return (
    <FeatureFlag feature="TEAM_MANAGEMENT">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Team Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            {team.avatar ? (
              <img
                src={team.avatar}
                alt={team.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-2xl">
                  {team.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
              <p className="text-gray-600">@{team.slug}</p>
              {team.description && (
                <p className="text-gray-700 mt-2">{team.description}</p>
              )}
            </div>
          </div>

          {/* Team Stats */}
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <span>{team._count.members} members</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>{team._count.projects} projects</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                team.userRole === 'ADMIN' ? 'bg-red-100 text-red-800' :
                team.userRole === 'MEMBER' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {team.userRole}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'overview' && <TeamDetails team={team} />}
          {activeTab === 'members' && (
            <TeamMembers team={team} onTeamUpdate={setTeam} />
          )}
          {activeTab === 'projects' && (
            <TeamProjects team={team} onTeamUpdate={setTeam} />
          )}
          {activeTab === 'activity' && <TeamActivity team={team} />}
          {activeTab === 'settings' && team.userRole === 'ADMIN' && (
            <TeamSettings team={team} onTeamUpdate={setTeam} />
          )}
        </div>
      </div>
    </FeatureFlag>
  );
}