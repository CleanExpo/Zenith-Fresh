import Link from 'next/link';
import { Project, Task } from '@prisma/client';

interface ProjectWithDetails extends Project {
  tasks: Task[];
  _count: {
    tasks: number;
    files: number;
  };
}

interface RecentProjectsProps {
  projects: ProjectWithDetails[];
}

export function RecentProjects({ projects }: RecentProjectsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Projects</h2>
      {projects.length > 0 ? (
        <div className="space-y-4">
          {projects.map((project) => (
            <div key={project.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Link 
                    href={`/projects/${project.id}`} 
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    {project.name}
                  </Link>
                  {project.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      {project.description}
                    </p>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{project._count.tasks} tasks</span>
                    <span>{project._count.files} files</span>
                    <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    project.status === 'active'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : project.status === 'draft'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                  }`}
                >
                  {project.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No projects yet. Create your first project to get started!
          </p>
          <Link
            href="/projects/new"
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <span className="text-lg mr-2">📊</span>
            Create Project
          </Link>
        </div>
      )}
    </div>
  );
}
