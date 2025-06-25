'use client';

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
  _count: {
    members: number;
    projects: number;
  };
}

interface TeamDetailsProps {
  team: Team;
}

export function TeamDetails({ team }: TeamDetailsProps) {
  const recentMembers = team.members
    .sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime())
    .slice(0, 5);

  const recentProjects = team.projects
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Team Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Team Members</p>
              <p className="text-2xl font-semibold text-gray-900">
                {team._count.members}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Projects</p>
              <p className="text-2xl font-semibold text-gray-900">
                {team._count.projects}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3a4 4 0 118 0v4M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3v4m0-4V3a4 4 0 10-8 0v4m8 0V7"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Your Role</p>
              <p className="text-2xl font-semibold text-gray-900 capitalize">
                {team.userRole.toLowerCase()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Members */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Members</h3>
            <span className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer">
              View all
            </span>
          </div>
          <div className="space-y-3">
            {recentMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {member.user.image ? (
                    <img
                      src={member.user.image}
                      alt={member.user.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-600 text-xs font-medium">
                        {member.user.name?.charAt(0) || member.user.email.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {member.user.name || member.user.email}
                    </p>
                    <p className="text-xs text-gray-500">
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  member.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                  member.role === 'MEMBER' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {member.role}
                </span>
              </div>
            ))}
            {recentMembers.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">
                No members yet
              </p>
            )}
          </div>
        </div>

        {/* Recent Projects */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Projects</h3>
            <span className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer">
              View all
            </span>
          </div>
          <div className="space-y-3">
            {recentProjects.map((teamProject) => (
              <div key={teamProject.id} className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">
                      {teamProject.project.name}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {teamProject.project.url}
                    </p>
                    {teamProject.project.description && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {teamProject.project.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Added by {teamProject.creator.name || teamProject.creator.email}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {recentProjects.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">
                No projects yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Team Information */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Created</p>
            <p className="text-sm text-gray-900">
              {new Date(team.createdAt).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Last Updated</p>
            <p className="text-sm text-gray-900">
              {new Date(team.updatedAt).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Team Slug</p>
            <p className="text-sm text-gray-900 font-mono">@{team.slug}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Team ID</p>
            <p className="text-sm text-gray-900 font-mono">{team.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}