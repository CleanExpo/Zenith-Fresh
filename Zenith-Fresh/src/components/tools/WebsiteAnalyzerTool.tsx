'use client';

import React, { useState, useEffect } from 'react';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';

interface Project {
  id: string;
  name: string;
  url: string;
  description?: string;
}

interface WebsiteAnalyzerToolProps {
  userId: string;
}

export function WebsiteAnalyzerTool({ userId }: WebsiteAnalyzerToolProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [analysisUrl, setAnalysisUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    url: '',
    description: '',
  });
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      // For demo purposes, create a mock project if none exist
      const mockProjects: Project[] = [
        {
          id: 'demo-project-1',
          name: 'Demo Website',
          url: 'https://example.com',
          description: 'Demo project for testing analytics',
        },
      ];
      setProjects(mockProjects);
      if (mockProjects.length > 0 && !selectedProject) {
        setSelectedProject(mockProjects[0].id);
        setAnalysisUrl(mockProjects[0].url);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const createProject = async () => {
    try {
      const project: Project = {
        id: `project-${Date.now()}`,
        name: newProject.name,
        url: newProject.url,
        description: newProject.description,
      };

      setProjects(prev => [...prev, project]);
      setSelectedProject(project.id);
      setAnalysisUrl(project.url);
      setShowCreateProject(false);
      setNewProject({ name: '', url: '', description: '' });
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const runAnalysis = async () => {
    if (!selectedProject || !analysisUrl) {
      setError('Please select a project and enter a URL');
      return;
    }

    try {
      setIsAnalyzing(true);
      setError(null);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: selectedProject,
          url: analysisUrl,
          analysisType: 'full',
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const results = await response.json();
      setAnalysisResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const selectedProjectData = projects.find(p => p.id === selectedProject);

  return (
    <div className="space-y-8">
      {/* Project Selection and Analysis Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project
              </label>
              <div className="flex space-x-2">
                <select
                  value={selectedProject}
                  onChange={(e) => {
                    setSelectedProject(e.target.value);
                    const project = projects.find(p => p.id === e.target.value);
                    if (project) {
                      setAnalysisUrl(project.url);
                    }
                  }}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select a project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setShowCreateProject(true)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                >
                  New
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL to Analyze
              </label>
              <input
                type="url"
                value={analysisUrl}
                onChange={(e) => setAnalysisUrl(e.target.value)}
                placeholder="https://example.com"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={runAnalysis}
              disabled={isAnalyzing || !selectedProject || !analysisUrl}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                  Analyzing...
                </>
              ) : (
                'Run Analysis'
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-800">
              <h4 className="font-medium">Analysis Error</h4>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {analysisResults && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="text-green-800">
              <h4 className="font-medium">Analysis Complete</h4>
              <p className="text-sm mt-1">
                Overall Score: {analysisResults.overallScore}/100 
                | Duration: {Math.round(analysisResults.duration / 1000)}s
                | Alerts: {analysisResults.alerts}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Project</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="My Website"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website URL
                </label>
                <input
                  type="url"
                  value={newProject.url}
                  onChange={(e) => setNewProject(prev => ({ ...prev, url: e.target.value }))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Brief description of your project"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={createProject}
                disabled={!newProject.name || !newProject.url}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Create Project
              </button>
              <button
                onClick={() => setShowCreateProject(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Dashboard */}
      {selectedProject && (
        <AnalyticsDashboard 
          projectId={selectedProject} 
          url={selectedProjectData?.url}
        />
      )}
    </div>
  );
}