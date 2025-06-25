'use client';

import React, { useState, useEffect } from 'react';
import { 
  GlobeAltIcon, 
  PlayIcon, 
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  CogIcon,
} from '@heroicons/react/24/outline';

interface Project {
  id: string;
  name: string;
  url: string;
}

interface ScanFormProps {
  onScanStarted: (scan: any) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export default function ScanForm({ onScanStarted, loading, setLoading }: ScanFormProps) {
  const [url, setUrl] = useState('');
  const [projectId, setProjectId] = useState('');
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [includeScreenshot, setIncludeScreenshot] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [createNewProject, setCreateNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const validateUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Please enter a URL to scan');
      return;
    }

    if (!validateUrl(url)) {
      setError('Please enter a valid URL (including http:// or https://)');
      return;
    }

    if (createNewProject && !newProjectName.trim()) {
      setError('Please enter a project name');
      return;
    }

    setLoading(true);

    try {
      // Create project if needed
      let selectedProjectId = projectId;
      
      if (createNewProject) {
        const projectResponse = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: newProjectName,
            url,
            description: `Project for ${url}`,
          }),
        });

        if (!projectResponse.ok) {
          throw new Error('Failed to create project');
        }

        const projectData = await projectResponse.json();
        selectedProjectId = projectData.project.id;
      }

      // Start the scan
      const scanResponse = await fetch('/api/website-analyzer/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          projectId: selectedProjectId || undefined,
          scanType: 'manual',
          options: {
            device,
            includeScreenshot,
            timeout: 30000,
          },
        }),
      });

      if (!scanResponse.ok) {
        const errorData = await scanResponse.json();
        throw new Error(errorData.error || 'Failed to start scan');
      }

      const scanData = await scanResponse.json();
      
      // Reset form
      setUrl('');
      setNewProjectName('');
      setCreateNewProject(false);
      setProjectId('');
      
      // Refresh projects list
      await fetchProjects();
      
      // Notify parent component
      onScanStarted(scanData.scan);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to start scan');
    } finally {
      setLoading(false);
    }
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    if (value && !newProjectName && createNewProject) {
      try {
        const hostname = new URL(value).hostname;
        setNewProjectName(hostname);
      } catch {
        // Invalid URL, keep existing name
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-6">
          <GlobeAltIcon className="h-8 w-8 text-blue-500 mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Start New Scan</h2>
            <p className="text-gray-600">Analyze your website's performance, accessibility, and SEO</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* URL Input */}
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
              Website URL
            </label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={loading}
            />
            <p className="mt-1 text-sm text-gray-500">
              Enter the full URL including https:// or http://
            </p>
          </div>

          {/* Project Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project
            </label>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="existing-project"
                  name="project-type"
                  checked={!createNewProject}
                  onChange={() => setCreateNewProject(false)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  disabled={loading}
                />
                <label htmlFor="existing-project" className="ml-2 text-sm text-gray-700">
                  Use existing project
                </label>
              </div>

              {!createNewProject && (
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                >
                  <option value="">Select a project (optional)</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} - {project.url}
                    </option>
                  ))}
                </select>
              )}

              <div className="flex items-center">
                <input
                  type="radio"
                  id="new-project"
                  name="project-type"
                  checked={createNewProject}
                  onChange={() => setCreateNewProject(true)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  disabled={loading}
                />
                <label htmlFor="new-project" className="ml-2 text-sm text-gray-700">
                  Create new project
                </label>
              </div>

              {createNewProject && (
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Project name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={loading}
                />
              )}
            </div>
          </div>

          {/* Device Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Device Type
            </label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setDevice('desktop')}
                className={`flex items-center px-4 py-2 rounded-md border ${
                  device === 'desktop'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
                disabled={loading}
              >
                <ComputerDesktopIcon className="h-5 w-5 mr-2" />
                Desktop
              </button>
              <button
                type="button"
                onClick={() => setDevice('mobile')}
                className={`flex items-center px-4 py-2 rounded-md border ${
                  device === 'mobile'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
                disabled={loading}
              >
                <DevicePhoneMobileIcon className="h-5 w-5 mr-2" />
                Mobile
              </button>
            </div>
          </div>

          {/* Advanced Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Advanced Options
            </label>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="include-screenshot"
                  checked={includeScreenshot}
                  onChange={(e) => setIncludeScreenshot(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={loading}
                />
                <label htmlFor="include-screenshot" className="ml-2 text-sm text-gray-700">
                  Include screenshot in results
                </label>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Starting Scan...
                </>
              ) : (
                <>
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Start Scan
                </>
              )}
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-start">
            <CogIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-2" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">What we analyze:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-600">
                <li>Performance metrics (Core Web Vitals)</li>
                <li>Accessibility compliance (WCAG guidelines)</li>
                <li>SEO optimization</li>
                <li>Best practices and security</li>
                <li>Technical issues and errors</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}