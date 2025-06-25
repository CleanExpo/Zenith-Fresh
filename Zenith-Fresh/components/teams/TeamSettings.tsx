'use client';

import { useState } from 'react';

interface Team {
  id: string;
  name: string;
  description?: string;
  slug: string;
  avatar?: string;
  settings?: any;
  userRole: 'ADMIN' | 'MEMBER' | 'VIEWER';
}

interface TeamSettingsProps {
  team: Team;
  onTeamUpdate: (team: Team) => void;
}

export function TeamSettings({ team, onTeamUpdate }: TeamSettingsProps) {
  const [formData, setFormData] = useState({
    name: team.name,
    description: team.description || '',
    settings: {
      allowMemberInvites: team.settings?.allowMemberInvites ?? false,
      requireApprovalForProjects: team.settings?.requireApprovalForProjects ?? false,
      publicProfile: team.settings?.publicProfile ?? false,
      ...team.settings,
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDangerZone, setShowDangerZone] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/teams/${team.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update team');
      }

      const data = await response.json();
      onTeamUpdate(data.team);
      setSuccess('Team settings updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (deleteConfirmation !== team.name) {
      setError('Please type the team name exactly to confirm deletion');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/teams/${team.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete team');
      }

      // Redirect to teams page
      window.location.href = '/teams';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: boolean) => {
    setFormData({
      ...formData,
      settings: {
        ...formData.settings,
        [key]: value,
      },
    });
  };

  if (team.userRole !== 'ADMIN') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">You do not have permission to view team settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Team Settings</h2>
        <p className="text-gray-600">
          Manage your team's configuration and preferences
        </p>
      </div>

      {/* General Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="What's your team about?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team Slug
            </label>
            <div className="flex items-center">
              <span className="bg-gray-50 border border-r-0 border-gray-300 rounded-l-md px-3 py-2 text-gray-500 text-sm">
                @
              </span>
              <input
                type="text"
                value={team.slug}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md bg-gray-50 text-gray-500 cursor-not-allowed"
                disabled
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Team slug cannot be changed after creation
            </p>
          </div>

          {/* Team Permissions */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Team Permissions</h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Allow members to invite others
                  </label>
                  <p className="text-xs text-gray-500">
                    When enabled, team members can send invitations to new members
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.settings.allowMemberInvites}
                    onChange={(e) => handleSettingChange('allowMemberInvites', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Require approval for project additions
                  </label>
                  <p className="text-xs text-gray-500">
                    When enabled, admin approval is required before projects are added to the team
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.settings.requireApprovalForProjects}
                    onChange={(e) => handleSettingChange('requireApprovalForProjects', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Public team profile
                  </label>
                  <p className="text-xs text-gray-500">
                    When enabled, your team profile will be visible to other users
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.settings.publicProfile}
                    onChange={(e) => handleSettingChange('publicProfile', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-green-800 text-sm">{success}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </div>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-lg border border-red-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-red-900">Danger Zone</h3>
            <p className="text-red-600 text-sm">
              Irreversible and destructive actions
            </p>
          </div>
          <button
            onClick={() => setShowDangerZone(!showDangerZone)}
            className="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            {showDangerZone ? 'Hide' : 'Show'}
          </button>
        </div>

        {showDangerZone && (
          <div className="space-y-4 pt-4 border-t border-red-200">
            <div>
              <h4 className="text-md font-medium text-red-900 mb-2">Delete Team</h4>
              <p className="text-sm text-red-700 mb-4">
                Once you delete a team, there is no going back. Please be certain.
                This will remove all team members, projects, and activity history.
              </p>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-red-700 mb-1">
                    Type the team name "{team.name}" to confirm:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder={team.name}
                  />
                </div>
                
                <button
                  onClick={handleDeleteTeam}
                  disabled={loading || deleteConfirmation !== team.name}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </div>
                  ) : (
                    'Delete Team Permanently'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}