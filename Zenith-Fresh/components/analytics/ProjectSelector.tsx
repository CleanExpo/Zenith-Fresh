'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface Project {
  id: string;
  name: string;
}

interface ProjectSelectorProps {
  projects: Project[];
  selectedProjectId: string;
}

export function ProjectSelector({ projects, selectedProjectId }: ProjectSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleProjectChange = (projectId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('projectId', projectId);
    router.push(`/dashboard/analytics?${params.toString()}`);
  };

  if (projects.length <= 1) {
    return null;
  }

  return (
    <div className="mt-4 sm:mt-0">
      <label htmlFor="project-select" className="block text-sm font-medium text-gray-700 mb-1">
        Select Project
      </label>
      <select
        id="project-select"
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        value={selectedProjectId}
        onChange={(e) => handleProjectChange(e.target.value)}
      >
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>
    </div>
  );
}