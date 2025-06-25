'use client';

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
  activities: TeamActivityItem[];
}

interface TeamActivityProps {
  team: Team;
}

export function TeamActivity({ team }: TeamActivityProps) {
  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'TEAM_CREATED':
        return '🎉';
      case 'TEAM_UPDATED':
        return '✏️';
      case 'MEMBER_ADDED':
        return '👋';
      case 'MEMBER_JOINED':
        return '🚪';
      case 'MEMBER_REMOVED':
        return '👋';
      case 'MEMBER_ROLE_CHANGED':
        return '🔄';
      case 'PROJECT_ADDED':
        return '📋';
      case 'PROJECT_REMOVED':
        return '🗑️';
      case 'INVITATION_SENT':
        return '📧';
      case 'INVITATION_ACCEPTED':
        return '✅';
      case 'INVITATION_DECLINED':
        return '❌';
      case 'SETTINGS_UPDATED':
        return '⚙️';
      default:
        return '📝';
    }
  };

  const getActivityTitle = (activity: TeamActivityItem) => {
    const userName = activity.user?.name || activity.user?.email || 'Someone';
    
    switch (activity.action) {
      case 'TEAM_CREATED':
        return `${userName} created the team`;
      case 'TEAM_UPDATED':
        return `${userName} updated team settings`;
      case 'MEMBER_ADDED':
        return `${userName} added ${activity.details?.addedUser?.name || activity.details?.addedUser?.email} to the team`;
      case 'MEMBER_JOINED':
        return `${userName} joined the team`;
      case 'MEMBER_REMOVED':
        return `${userName} removed ${activity.details?.removedUser?.name || activity.details?.removedUser?.email} from the team`;
      case 'MEMBER_ROLE_CHANGED':
        return `${userName} changed ${activity.details?.targetUser?.name || activity.details?.targetUser?.email}'s role`;
      case 'PROJECT_ADDED':
        return `${userName} added project "${activity.details?.project?.name}"`;
      case 'PROJECT_REMOVED':
        return `${userName} removed project "${activity.details?.project?.name}"`;
      case 'INVITATION_SENT':
        return `${userName} invited ${activity.details?.invitedEmail}`;
      case 'INVITATION_ACCEPTED':
        return `${activity.details?.joinedUser?.name || activity.details?.joinedUser?.email} accepted an invitation`;
      case 'INVITATION_DECLINED':
        return `${activity.details?.declinedEmail} declined an invitation`;
      case 'SETTINGS_UPDATED':
        return `${userName} updated team settings`;
      default:
        return `${userName} performed an action`;
    }
  };

  const getActivityDescription = (activity: TeamActivityItem) => {
    switch (activity.action) {
      case 'TEAM_CREATED':
        return `Team "${activity.details?.teamName}" was created`;
      case 'TEAM_UPDATED':
        return activity.details?.updatedFields?.length 
          ? `Updated: ${activity.details.updatedFields.join(', ')}`
          : 'Team information was updated';
      case 'MEMBER_ADDED':
      case 'MEMBER_JOINED':
        return `Role: ${activity.details?.role || 'Member'}`;
      case 'MEMBER_ROLE_CHANGED':
        return `Changed from ${activity.details?.oldRole} to ${activity.details?.newRole}`;
      case 'PROJECT_ADDED':
        return activity.details?.project?.url || 'Project details not available';
      case 'PROJECT_REMOVED':
        return 'Project was removed from the team';
      case 'INVITATION_SENT':
        return `Role: ${activity.details?.role || 'Member'}`;
      case 'INVITATION_ACCEPTED':
        return `New member joined with ${activity.details?.role} role`;
      case 'INVITATION_DECLINED':
        return 'Invitation was declined';
      default:
        return 'Activity details not available';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Team Activity</h2>
        <p className="text-gray-600">
          Recent activity and changes in your team
        </p>
      </div>

      {/* Activity Feed */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6">
          {team.activities.length > 0 ? (
            <div className="space-y-6">
              {team.activities.map((activity, index) => (
                <div key={activity.id} className="relative">
                  {/* Timeline connector */}
                  {index < team.activities.length - 1 && (
                    <div className="absolute left-6 top-12 w-0.5 h-6 bg-gray-200"></div>
                  )}
                  
                  <div className="flex items-start space-x-4">
                    {/* Activity Icon */}
                    <div className="flex-shrink-0 w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-lg">
                      {getActivityIcon(activity.action)}
                    </div>
                    
                    {/* Activity Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900">
                          {getActivityTitle(activity)}
                        </h3>
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                          {formatTimeAgo(activity.createdAt)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1">
                        {getActivityDescription(activity)}
                      </p>

                      {/* User Avatar and Info */}
                      {activity.user && (
                        <div className="flex items-center mt-2 space-x-2">
                          {activity.user.image ? (
                            <img
                              src={activity.user.image}
                              alt={activity.user.name}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-gray-600 text-xs">
                                {activity.user.name?.charAt(0) || activity.user.email.charAt(0)}
                              </span>
                            </div>
                          )}
                          <span className="text-xs text-gray-500">
                            {activity.user.name || activity.user.email}
                          </span>
                        </div>
                      )}

                      {/* Metadata */}
                      {activity.metadata && (
                        <div className="mt-2 text-xs text-gray-400">
                          {activity.metadata.ipAddress && (
                            <span>IP: {activity.metadata.ipAddress}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No activity yet
              </h3>
              <p className="text-gray-600">
                Team activity will appear here as members interact with the team.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Activity Legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Activity Types</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs text-gray-600">
          <div className="flex items-center space-x-2">
            <span>🎉</span>
            <span>Team created</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>👋</span>
            <span>Member added/removed</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>📋</span>
            <span>Project shared</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>📧</span>
            <span>Invitation sent</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>🔄</span>
            <span>Role changed</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>⚙️</span>
            <span>Settings updated</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>✅</span>
            <span>Invitation accepted</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>❌</span>
            <span>Invitation declined</span>
          </div>
        </div>
      </div>
    </div>
  );
}