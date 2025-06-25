'use client';

import { useState } from 'react';
import Link from 'next/link';

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
  userRole: 'ADMIN' | 'MEMBER' | 'VIEWER';
  projects: TeamProject[];
}

interface TeamProjectsProps {
  team: Team;
  onTeamUpdate: (team: Team) => void;
}

export function TeamProjects({ team, onTeamUpdate }: TeamProjectsProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [userProjects, setUserProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManageProjects = team.userRole === 'ADMIN' || team.userRole === 'MEMBER';

  const fetchUserProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects');
      
      if (response.ok) {
        const data = await response.json();
        // Filter out projects already in the team
        const teamProjectIds = team.projects.map(tp => tp.project.id);
        const availableProjects = data.projects?.filter(
          (project: any) => !teamProjectIds.includes(project.id)
        ) || [];
        setUserProjects(availableProjects);
      }
    } catch (err) {
      console.error('Error fetching user projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/teams/${team.id}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: selectedProjectId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add project');
      }

      const data = await response.json();
      
      // Update team with new project
      onTeamUpdate({
        ...team,
        projects: [data.teamProject, ...team.projects],
      });

      setShowAddModal(false);
      setSelectedProjectId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProject = async (teamProjectId: string) => {
    if (!confirm('Are you sure you want to remove this project from the team?')) {
      return;
    }

    try {
      const response = await fetch(`/api/teams/${team.id}/projects/${teamProjectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove project');
      }

      // Update team projects
      const updatedProjects = team.projects.filter(
        project => project.id !== teamProjectId
      );

      onTeamUpdate({
        ...team,
        projects: updatedProjects,
      });
    } catch (err) {
      console.error('Error removing project:', err);
    }
  };

  const handleShowAddModal = () => {
    setShowAddModal(true);
    fetchUserProjects();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Team Projects</h2>
          <p className="text-gray-600">
            {team.projects.length} projects shared with the team
          </p>
        </div>
        {canManageProjects && (
          <button
            onClick={handleShowAddModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add Project
          </button>
        )}
      </div>

      {/* Projects Grid */}
      {team.projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {team.projects.map((teamProject) => (
            <div key={teamProject.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {teamProject.project.name}
                  </h3>
                  <p className="text-sm text-blue-600 hover:text-blue-700 break-all">
                    <Link href={teamProject.project.url} target="_blank" rel="noopener noreferrer">
                      {teamProject.project.url}
                    </Link>
                  </p>
                  {teamProject.project.description && (
                    <p className="text-gray-600 text-sm mt-2 line-clamp-3">
                      {teamProject.project.description}
                    </p>
                  )}
                </div>
                {canManageProjects && (
                  <button
                    onClick={() => handleRemoveProject(teamProject.id)}
                    className="text-gray-400 hover:text-red-600 p-1 ml-2"
                    title="Remove from team"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div>
                  <p>Added by {teamProject.creator.name || teamProject.creator.email}</p>
                  <p>{new Date(teamProject.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex space-x-2">
                  <Link
                    href={`/projects/${teamProject.project.id}`}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
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
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No projects yet
          </h3>
          <p className="text-gray-600 mb-4">
            Start collaborating by adding projects to your team.
          </p>
          {canManageProjects && (
            <button
              onClick={handleShowAddModal}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add Your First Project
            </button>
          )}
        </div>
      )}

      {/* Add Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Add Project to Team</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Project
                </label>
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : userProjects.length > 0 ? (
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Choose a project...</option>
                    {userProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name} ({project.url})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p>No available projects to add.</p>
                    <p className="text-sm mt-1">
                      Create a new project first, then add it to the team.
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedProjectId || userProjects.length === 0}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Adding...
                    </div>
                  ) : (
                    'Add Project'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}